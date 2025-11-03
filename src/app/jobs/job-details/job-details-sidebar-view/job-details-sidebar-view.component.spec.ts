import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { JobDetailsSidebarViewComponent } from './job-details-sidebar-view.component';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';

describe('JobDetailsSidebarViewComponent', () => {
  let component: JobDetailsSidebarViewComponent;
  let fixture: ComponentFixture<JobDetailsSidebarViewComponent>;
  let localDateFormat: Partial<LocalDateFormatPipe>;

  beforeEach(waitForAsync(() => {
    const localDateFormatPipe = jasmine.createSpyObj('LocalDateFormatPipe',['transform']);
    TestBed.configureTestingModule({
      declarations: [ JobDetailsSidebarViewComponent ],
      imports:[
        HttpClientTestingModule
      ],
      providers:[
        { provide: LocalDateFormatPipe, useValue:  localDateFormatPipe}
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JobDetailsSidebarViewComponent);
    component = fixture.componentInstance;
    localDateFormat = TestBed.inject(LocalDateFormatPipe);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

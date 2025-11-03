import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MarkAsComSidePanelComponent } from './mark-as-complete-side-panel';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { NgxStarRatingModule } from 'ngx-star-rating';
describe('MarkAsComSidePanelComponent', () => {
  let component: MarkAsComSidePanelComponent;
  let fixture: ComponentFixture<MarkAsComSidePanelComponent>;
  CommonTestingModule.setUpTestBed(MarkAsComSidePanelComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MarkAsComSidePanelComponent ],
      imports: [NgxStarRatingModule],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MarkAsComSidePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

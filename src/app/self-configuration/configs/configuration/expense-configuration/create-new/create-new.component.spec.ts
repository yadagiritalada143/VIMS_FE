import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateNewComponent } from './create-new.component';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { SvmsDatepickerComponent } from 'src/app/shared/components/svms-datepicker/svms-datepicker.component';

describe('CreateNewComponent', () => {
  let component: CreateNewComponent;
  let fixture: ComponentFixture<CreateNewComponent>;
  CommonTestingModule.setUpTestBed(CreateNewComponent);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateNewComponent, SvmsDatepickerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

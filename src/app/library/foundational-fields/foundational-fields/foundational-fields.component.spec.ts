import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FoundationalFieldsComponent } from './foundational-fields.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('FoundationalFieldsComponent', () => {
  let component: FoundationalFieldsComponent;
  let fixture: ComponentFixture<FoundationalFieldsComponent>;
  CommonTestingModule.setUpTestBed(FoundationalFieldsComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(FoundationalFieldsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

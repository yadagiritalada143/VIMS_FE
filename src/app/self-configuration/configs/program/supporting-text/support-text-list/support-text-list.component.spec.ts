import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SupportTextListComponent } from './support-text-list.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('SupportTextListComponent', () => {
  let component: SupportTextListComponent;
  let fixture: ComponentFixture<SupportTextListComponent>;
  CommonTestingModule.setUpTestBed(SupportTextListComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(SupportTextListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
